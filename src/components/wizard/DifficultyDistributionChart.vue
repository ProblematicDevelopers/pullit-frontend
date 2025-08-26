<!--
  난이도 분포 차트 컴포넌트
  
  스마트 문항 선택 후 목표 분포와 실제 분포를 시각적으로 비교하여 보여줍니다.
  대체 문항 선택 내역과 경고 메시지도 함께 표시합니다.
-->

<template>
  <div class="difficulty-distribution-chart">
    <!-- 차트 헤더 -->
    <div class="chart-header">
      <h4>
        <span class="icon">📊</span>
        난이도 분포 분석
      </h4>
      <div class="status-badge" :class="statusClass">
        {{ statusText }}
      </div>
    </div>

    <!-- 분포 차트 -->
    <div class="distribution-bars">
      <div 
        v-for="level in difficultyLevels" 
        :key="level.value"
        class="bar-group"
      >
        <div class="bar-label">
          <span class="level-name">{{ level.name }}</span>
          <span class="level-icon">{{ level.icon }}</span>
        </div>
        
        <div class="bars-container">
          <!-- 목표 분포 바 -->
          <div class="bar-wrapper target">
            <div 
              class="bar"
              :style="{ 
                width: getTargetPercentage(level.value) + '%',
                backgroundColor: level.targetColor
              }"
            >
              <span class="bar-value" v-if="getTargetCount(level.value) > 0">
                {{ getTargetCount(level.value) }}개
              </span>
            </div>
            <span class="bar-percentage">
              목표: {{ getTargetPercentage(level.value) }}%
            </span>
          </div>
          
          <!-- 실제 분포 바 -->
          <div class="bar-wrapper actual">
            <div 
              class="bar"
              :style="{ 
                width: getActualPercentage(level.value) + '%',
                backgroundColor: level.actualColor
              }"
            >
              <span class="bar-value" v-if="getActualCount(level.value) > 0">
                {{ getActualCount(level.value) }}개
              </span>
            </div>
            <span class="bar-percentage">
              실제: {{ getActualPercentage(level.value) }}%
              <span 
                v-if="getDifference(level.value) !== 0"
                class="difference"
                :class="{ positive: getDifference(level.value) > 0 }"
              >
                ({{ getDifference(level.value) > 0 ? '+' : '' }}{{ getDifference(level.value) }}%)
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 요약 정보 -->
    <div class="summary-section">
      <div class="summary-item">
        <span class="summary-label">요청 문항:</span>
        <span class="summary-value">{{ metadata?.requestedCount || 0 }}개</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">선택 문항:</span>
        <span class="summary-value">{{ metadata?.totalCount || 0 }}개</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">충족률:</span>
        <span class="summary-value" :class="fulfillmentClass">
          {{ fulfillmentRate }}%
        </span>
      </div>
    </div>

    <!-- 대체 액션 정보 -->
    <div v-if="report?.fallbackActions?.length > 0" class="fallback-section">
      <h5>
        <span class="icon">🔄</span>
        대체 문항 선택 내역
      </h5>
      <ul class="fallback-list">
        <li 
          v-for="(action, index) in report.fallbackActions" 
          :key="index"
          class="fallback-item"
        >
          <span class="fallback-icon">➕</span>
          <span class="fallback-text">
            <strong>{{ action.difficultyName }}</strong>에 
            <span class="count">{{ action.added }}개</span> 추가
            <span class="reason">({{ action.reason }})</span>
          </span>
        </li>
      </ul>
    </div>

    <!-- 경고 메시지 -->
    <div v-if="report?.warnings?.length > 0" class="warnings-section">
      <h5>
        <span class="icon">⚠️</span>
        주의사항
      </h5>
      <ul class="warning-list">
        <li 
          v-for="(warning, index) in report.warnings" 
          :key="index"
          class="warning-item"
        >
          {{ warning }}
        </li>
      </ul>
    </div>

    <!-- 팁 -->
    <div class="tip-section">
      <p class="tip">
        💡 <strong>팁:</strong> 특정 난이도의 문항이 부족한 경우, 시스템이 자동으로 인접한 난이도에서 문항을 보충하여 전체 문항 수를 맞춥니다.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  metadata: {
    type: Object,
    default: () => null
  },
  report: {
    type: Object,
    default: () => null
  }
})

// 난이도 레벨 정의
const difficultyLevels = [
  { 
    value: 1, 
    name: '매우 쉬움', 
    icon: '🟢',
    targetColor: '#86EFAC',
    actualColor: '#10B981'
  },
  { 
    value: 2, 
    name: '쉬움', 
    icon: '🔵',
    targetColor: '#93C5FD',
    actualColor: '#3B82F6'
  },
  { 
    value: 3, 
    name: '보통', 
    icon: '🟡',
    targetColor: '#FDE68A',
    actualColor: '#F59E0B'
  },
  { 
    value: 4, 
    name: '어려움', 
    icon: '🟠',
    targetColor: '#FDBA74',
    actualColor: '#F97316'
  },
  { 
    value: 5, 
    name: '매우 어려움', 
    icon: '🔴',
    targetColor: '#FCA5A5',
    actualColor: '#EF4444'
  }
]

// Computed
const fulfillmentRate = computed(() => {
  if (!props.metadata) return 0
  const requested = props.metadata.requestedCount || 0
  const selected = props.metadata.totalCount || 0
  return requested > 0 ? Math.round((selected / requested) * 100) : 0
})

const fulfillmentClass = computed(() => {
  const rate = fulfillmentRate.value
  if (rate >= 95) return 'excellent'
  if (rate >= 80) return 'good'
  if (rate >= 60) return 'fair'
  return 'poor'
})

const statusClass = computed(() => {
  const rate = fulfillmentRate.value
  if (rate >= 95) return 'success'
  if (rate >= 80) return 'warning'
  return 'danger'
})

const statusText = computed(() => {
  const rate = fulfillmentRate.value
  if (rate >= 95) return '최적 분포'
  if (rate >= 80) return '양호한 분포'
  if (rate >= 60) return '일부 조정됨'
  return '대체 문항 다수'
})

// Methods
const getTargetCount = (level) => {
  return props.metadata?.targetDistribution?.[level] || 0
}

const getTargetPercentage = (level) => {
  const requested = props.metadata?.requestedCount || 0
  const target = getTargetCount(level)
  return requested > 0 ? Math.round((target / requested) * 100) : 0
}

const getActualCount = (level) => {
  return props.metadata?.actualDistribution?.[level]?.count || 0
}

const getActualPercentage = (level) => {
  return props.metadata?.actualDistribution?.[level]?.percentage || 0
}

const getDifference = (level) => {
  return getActualPercentage(level) - getTargetPercentage(level)
}
</script>

<style scoped>
.difficulty-distribution-chart {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #F3F4F6;
}

/* 차트 헤더 */
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #F3F4F6;
}

.chart-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-header .icon {
  font-size: 24px;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.success {
  background: #DCFCE7;
  color: #166534;
  border: 1px solid #BBF7D0;
}

.status-badge.warning {
  background: #FEF3C7;
  color: #92400E;
  border: 1px solid #FDE68A;
}

.status-badge.danger {
  background: #FEE2E2;
  color: #991B1B;
  border: 1px solid #FECACA;
}

/* 분포 차트 */
.distribution-bars {
  margin-bottom: 24px;
}

.bar-group {
  margin-bottom: 20px;
}

.bar-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.level-icon {
  font-size: 16px;
}

.bars-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 28px;
}

.bar-wrapper.target {
  opacity: 0.6;
}

.bar {
  height: 100%;
  min-width: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  transition: all 0.3s ease;
  position: relative;
}

.bar-value {
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.bar-percentage {
  font-size: 12px;
  color: #6B7280;
  white-space: nowrap;
}

.difference {
  font-weight: 600;
  color: #EF4444;
}

.difference.positive {
  color: #10B981;
}

/* 요약 섹션 */
.summary-section {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: #F9FAFB;
  border-radius: 8px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-label {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
}

.summary-value {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.summary-value.excellent {
  color: #10B981;
}

.summary-value.good {
  color: #3B82F6;
}

.summary-value.fair {
  color: #F59E0B;
}

.summary-value.poor {
  color: #EF4444;
}

/* 대체 액션 섹션 */
.fallback-section {
  background: #FEF3C7;
  border: 1px solid #FDE68A;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.fallback-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #92400E;
  display: flex;
  align-items: center;
  gap: 6px;
}

.fallback-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.fallback-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #78350F;
}

.fallback-icon {
  color: #F59E0B;
  font-weight: 700;
  margin-top: 2px;
}

.fallback-text .count {
  font-weight: 700;
  color: #92400E;
}

.fallback-text .reason {
  font-size: 12px;
  color: #92400E;
  opacity: 0.8;
}

/* 경고 섹션 */
.warnings-section {
  background: #FEE2E2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.warnings-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #991B1B;
  display: flex;
  align-items: center;
  gap: 6px;
}

.warning-list {
  margin: 0;
  padding: 0 0 0 20px;
}

.warning-item {
  font-size: 13px;
  color: #7F1D1D;
  margin-bottom: 6px;
}

/* 팁 섹션 */
.tip-section {
  background: #EFF6FF;
  border: 1px solid #DBEAFE;
  border-radius: 8px;
  padding: 12px 16px;
}

.tip {
  margin: 0;
  font-size: 13px;
  color: #1E40AF;
  line-height: 1.6;
}

.tip strong {
  font-weight: 600;
}

/* 반응형 */
@media (max-width: 768px) {
  .summary-section {
    flex-direction: column;
    gap: 12px;
  }
  
  .bar-percentage {
    font-size: 11px;
  }
  
  .bar-value {
    font-size: 11px;
  }
}
</style>